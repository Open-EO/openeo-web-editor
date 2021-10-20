pipeline {
    agent {
      node {
        label 'devdmz'
      }
    }
    environment {
      package_name = 'openeo-vito-webeditor'
      base_repo = 'https://github.com/JanssenBrm/openeo-web-editor.git'
      base_branch = 'master'
      base_dir = 'openeo-web-editor'
      tag_version = true
      wipeout_workspace = true
      BRANCH_NAME        = "${env.BRANCH_NAME}"
      BUILD_NUMBER       = "${env.BUILD_NUMBER}"
      BUILD_URL          = "${env.BUILD_URL}"
      DATE               = utils.getDate()
      JOB_BASE_NAME      = "${env.JOB_BASE_NAME}"
      JOB_NAME           = "${env.JOB_NAME}"
      JOB_URL            = "${env.JOB_URL}"
      PACKAGE_NAME       = "${package_name}"
      PROJECT_OWNER_MAIL = "${project_owner_mail}"
      TAG_VERSION        = "${tag_version}"
      WORKSPACE          = "${env.WORKSPACE}"
    }
    options {
      skipDefaultCheckout(true)
      disableConcurrentBuilds()
    }
    stages {
      stage('Checkout') {
        steps {
          script {
            // Checkout the git repository
            git.checkoutDefault(wipeout_workspace)
            // Set env variables that need the git repository
            env.GIT_COMMIT = git.getCommit()
            env.MAIL_ADDRESS = utils.getMailAddress()
          }
        }
      }
      stage('Checking out base version') {
        steps {
          script {
            git.checkoutRepo(base_repo, base_branch, '7b5c490c-d448-4082-843c-6a609873c4ba')
          }
        }
      }
      stage('Copy config') {
        steps {
          script {
            sh """
                cp config/* $base_dir
            """
          }
        }
      }

      stage('Build image') {
        steps {
          script {
            def package_version = "${BUILD_NUMBER}"
            def docker_registry = globalDefaults.docker_registry_prod()
            def base_docker_name = docker_registry + '/' + package_name
            env.PACKAGE_VERSION = package_version
            env.IMAGE_NAME_TAG = base_docker_name  + ':' + package_version
            env.IMAGE_NAME_LATEST = base_docker_name + ':latest'

            dir(base_dir) {
              containerImage.build(env.IMAGE_NAME_TAG, '', [], 'Dockerfile')
              containerImage.tag("${env.IMAGE_NAME_TAG}", "${env.IMAGE_NAME_LATEST}")
              containerImage.push("${env.IMAGE_NAME_TAG}")
              containerImage.push("${env.IMAGE_NAME_LATEST}")
            }
          }
        }
        post {
          always {
            script {
              containerImage.delete(env.IMAGE_NAME_TAG)
              containerImage.delete("${env.IMAGE_NAME_LATEST}")
            }
          }
        }
      }

    }
    post {
      // Send notification on error
      failure {
        script {
          notification.fail(env.MAIL_ADDRESS, env.PROJECT_OWNER_MAIL)
        }
      }
    }
}
